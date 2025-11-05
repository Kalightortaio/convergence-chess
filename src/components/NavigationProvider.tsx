import React, { createContext, useContext, ReactNode } from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

const NavigationContext = createContext<NavigationProp<ParamListBase> | undefined>(undefined);

export const useNavigationContext = () => {
    const navigation = useContext(NavigationContext);
    if (!navigation) {
        throw new Error('useNavigationContext must be used within a NavigationProvider');
    }
    return navigation;
};

type NavigationProviderProps = {
    navigation: NavigationProp<ParamListBase>;
    children: ReactNode;
};

export const NavigationProvider = ({ navigation, children }: NavigationProviderProps) => (
    <NavigationContext.Provider value={navigation}>
        {children}
    </NavigationContext.Provider>
);